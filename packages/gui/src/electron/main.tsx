import {
  app,
  dialog,
  net,
  shell,
  ipcMain,
  BrowserWindow,
  IncomingMessage,
  Menu,
  nativeImage,
} from 'electron';
import { initialize } from '@electron/remote/main';
import path from 'path';
import React from 'react';
import url from 'url';
import ReactDOMServer from 'react-dom/server';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';
import '../config/env';
import handleSquirrelEvent from './handleSquirrelEvent';
import loadConfig from '../util/loadConfig';
import manageDaemonLifetime from '../util/manageDaemonLifetime';
import moonEnvironment from '../util/moonEnvironment';
import { setUserDataDir } from '../util/userData';
import { i18n } from '../config/locales';
import About from '../components/about/About';
import packageJson from '../../package.json';
import AppIcon from '../assets/img/moon64x64.png';
import windowStateKeeper from 'electron-window-state';

const NET = 'mainnet';

app.disableHardwareAcceleration();

initialize();

const appIcon = nativeImage.createFromPath(path.join(__dirname, AppIcon));

setUserDataDir();

function renderAbout(): string {
  const sheet = new ServerStyleSheet();
  const about = ReactDOMServer.renderToStaticMarkup(
    <StyleSheetManager sheet={sheet.instance}>
      <About
        packageJson={packageJson}
        versions={process.versions}
        version={app.getVersion()}
      />
    </StyleSheetManager>,
  );

  const tags = sheet.getStyleTags();
  const result = about.replace('{{CSS}}', tags);

  sheet.seal();

  return result;
}

const openedWindows = new Set<BrowserWindow>();

function openAbout() {
  const about = renderAbout();

  const aboutWindow = new BrowserWindow({
    width: 400,
    height: 460,
    useContentSize: true,
    titleBarStyle: 'hiddenInset',
  });
  aboutWindow.loadURL(`data:text/html;charset=utf-8,${about}`);

  aboutWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  aboutWindow.once('closed', () => {
    openedWindows.delete(aboutWindow);
  });

  aboutWindow.setMenu(null);
  openedWindows.add(aboutWindow);
}

if (!handleSquirrelEvent()) {
  const ensureSingleInstance = () => {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
      return false;
    }
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    });

    return true;
  };

  const ensureCorrectEnvironment = () => {
    if (!moonEnvironment.guessPackaged() && !('VIRTUAL_ENV' in process.env)) {
      app.quit();
      return false;
    }
    return true;
  };

  let mainWindow = null;

  const createMenu = () => Menu.buildFromTemplate(getMenuTemplate());

  if (ensureSingleInstance() && ensureCorrectEnvironment()) {
    const exitPyProc = (e) => {};

    app.on('will-quit', exitPyProc);

    let decidedToClose = false;
    let isClosing = false;

    const createWindow = async () => {
      if (manageDaemonLifetime(NET)) {
        moonEnvironment.startMoonDaemon();
      }

      ipcMain.handle('getConfig', () => loadConfig(NET));
      ipcMain.handle('getTempDir', () => app.getPath('temp'));
      ipcMain.handle('getVersion', () => app.getVersion());

      ipcMain.handle(
        'fetchTextResponse',
        async (_event, requestOptions, requestHeaders, requestData) => {
          const request = net.request(requestOptions as any);

          Object.entries(requestHeaders || {}).forEach(([header, value]) => {
            request.setHeader(header, value as any);
          });

          let err: any | undefined = undefined;
          let statusCode: number | undefined = undefined;
          let statusMessage: string | undefined = undefined;
          let responseBody: string | undefined = undefined;

          try {
            responseBody = await new Promise((resolve, reject) => {
              request.on('response', (response: IncomingMessage) => {
                statusCode = response.statusCode;
                statusMessage = response.statusMessage;

                response.on('data', (chunk) => {
                  const body = chunk.toString('utf8');
                  resolve(body);
                });

                response.on('error', (e: string) => {
                  reject(new Error(e));
                });
              });

              request.on('error', (error: any) => {
                reject(error);
              });

              request.write(requestData);
              request.end();
            });
          } catch (e) {
            console.error(e);
            err = e;
          }

          return { err, statusCode, statusMessage, responseBody };
        },
      );

      ipcMain.handle(
        'fetchBinaryContent',
        async (
          _event,
          requestOptions = {},
          requestHeaders = {},
          requestData?: any,
        ) => {
          const { maxSize = Infinity, ...rest } = requestOptions;
          const request = net.request(rest);

          Object.entries(requestHeaders).forEach(
            ([header, value]: [string, any]) => {
              request.setHeader(header, value);
            },
          );

          let error: Error | undefined;
          let statusCode: number | undefined;
          let statusMessage: string | undefined;
          let contentType: string | undefined;
          let encoding = 'binary';
          let data: string | undefined;

          const buffers: Buffer[] = [];
          let totalLength = 0;

          try {
            data = await new Promise((resolve, reject) => {
              request.on('response', (response: IncomingMessage) => {
                statusCode = response.statusCode;
                statusMessage = response.statusMessage;

                const rawContentType = response.headers['content-type'];
                if (rawContentType) {
                  if (Array.isArray(rawContentType)) {
                    contentType = rawContentType[0];
                  } else {
                    contentType = rawContentType;
                  }

                  if (contentType) {
                    const charsetMatch = contentType.match(/charset=([^;]+)/);
                    if (charsetMatch) {
                      encoding = charsetMatch[1];
                    }
                  }
                }

                response.on('data', (chunk) => {
                  buffers.push(chunk);
                  totalLength += chunk.byteLength;

                  if (totalLength > maxSize) {
                    reject(new Error('Response too large'));
                    request.abort();
                  }
                });

                response.on('end', () => {
                  resolve(
                    Buffer.concat(buffers).toString(encoding as BufferEncoding),
                  );
                });

                response.on('error', (e: string) => {
                  reject(new Error(e));
                });
              });

              request.on('error', (error: any) => {
                reject(error);
              });

              if (requestData) {
                request.write(requestData);
              }

              request.end();
            });
          } catch (e: any) {
            error = e;
          }

          return { error, statusCode, statusMessage, encoding, data };
        },
      );

      ipcMain.handle('showMessageBox', async (_event, options) => {
        return await dialog.showMessageBox(mainWindow, options);
      });

      ipcMain.handle('showOpenDialog', async (_event, options) => {
        return await dialog.showOpenDialog(options);
      });

      ipcMain.handle('showSaveDialog', async (_event, options) => {
        return await dialog.showSaveDialog(options);
      });

      ipcMain.handle('download', async (_event, options) => {
        return await mainWindow.webContents.downloadURL(options.url);
      });

      // اضافه کردن هندلر برای کنترل دکمه‌های پنجره
      ipcMain.on('window-control', (event, action) => {
        if (!mainWindow) return;

        switch (action) {
          case 'minimize':
            mainWindow.minimize();
            break;
          case 'maximize':
            if (mainWindow.isMaximized()) {
              mainWindow.unmaximize();
            } else {
              mainWindow.maximize();
            }
            break;
          case 'close':
            if (decidedToClose || !manageDaemonLifetime(NET)) {
              mainWindow.close();
            } else {
              const choice = dialog.showMessageBoxSync(mainWindow, {
                type: 'question',
                buttons: ['No', 'Yes'],
                title: 'Confirm',
                message: 'Are you sure you want to quit?',
              });
              if (choice === 1) {
                decidedToClose = true;
                mainWindow.webContents.send('exit-daemon');
              }
            }
            break;
        }
      });

      decidedToClose = false;
      const mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 1200,
      });
      
      // تغییرات اصلی: اضافه کردن frame: false و titleBarStyle
      mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 500,
        minHeight: 500,
        backgroundColor: '#ffffff',
        show: false,
        frame: false, // حذف فریم پیش‌فرض
        titleBarStyle: 'hidden', // عنوان بار مخفی
        webPreferences: {
          preload: `${__dirname}/preload.js`,
          nodeIntegration: true,
          contextIsolation: false,
          nativeWindowOpen: true,
        },
      });

      mainWindowState.manage(mainWindow);

      if (process.platform === 'linux') {
        mainWindow.setIcon(appIcon);
      }

      mainWindow.once('ready-to-show', () => {
        mainWindow.show();
      });

      if (!manageDaemonLifetime(NET)) {
        mainWindow.webContents.on('did-finish-load', async () => {
          const { url } = await loadConfig(NET);
          if (mainWindow) {
            mainWindow.setTitle(`${app.getName()} [${url}]`);
          }
        });
      }

      mainWindow.on('close', (e) => {
        if (decidedToClose || !manageDaemonLifetime(NET)) {
          return;
        }
        e.preventDefault();
        if (!isClosing) {
          isClosing = true;
          const choice = dialog.showMessageBoxSync({
            type: 'question',
            buttons: [
              i18n._(/* i18n */ { id: 'No' }),
              i18n._(/* i18n */ { id: 'Yes' }),
            ],
            title: i18n._(/* i18n */ { id: 'Confirm' }),
            message: i18n._(
              /* i18n */ {
                id: 'Are you sure you want to quit?',
              },
            ),
          });
          if (choice == 0) {
            isClosing = false;
            return;
          }
          isClosing = false;
          decidedToClose = true;
          mainWindow.webContents.send('exit-daemon');
          mainWindowState.saveState(mainWindow);
          mainWindowState.unmanage(mainWindow);
          mainWindow.setBounds({ height: 500, width: 500 });
          mainWindow.center();
          ipcMain.on('daemon-exited', (event, args) => {
            mainWindow.close();
            openedWindows.forEach((win) => win.close());
          });
        }
      });

      const startUrl =
        process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000'
          : url.format({
              pathname: path.join(__dirname, '/../renderer/index.html'),
              protocol: 'file:',
              slashes: true,
            });

      mainWindow.loadURL(startUrl);
      require('@electron/remote/main').enable(mainWindow.webContents);
    };

    const appReady = async () => {
      createWindow();
      app.applicationMenu = createMenu();
    };

    app.on('ready', appReady);

    app.on('window-all-closed', () => {
      app.quit();
    });

    ipcMain.on('load-page', (_, arg: { file: string; query: string }) => {
      mainWindow.loadURL(
        require('url').format({
          pathname: path.join(__dirname, arg.file),
          protocol: 'file:',
          slashes: true,
        }) + arg.query,
      );
    });

    ipcMain.handle('setLocale', (_event, locale: string) => {
      i18n.activate(locale);
      app.applicationMenu = createMenu();
    });
  }

  const getMenuTemplate = () => {
    const template = [
      {
        label: i18n._(/* i18n */ { id: 'File' }),
        submenu: [
          {
            role: 'quit',
          },
        ],
      },
      {
        label: i18n._(/* i18n */ { id: 'Edit' }),
        submenu: [
          {
            role: 'undo',
          },
          {
            role: 'redo',
          },
          {
            type: 'separator',
          },
          {
            role: 'cut',
          },
          {
            role: 'copy',
          },
          {
            role: 'paste',
          },
          {
            role: 'delete',
          },
          {
            type: 'separator',
          },
          {
            role: 'selectall',
          },
        ],
      },
      {
        label: i18n._(/* i18n */ { id: 'View' }),
        submenu: [
          {
            role: 'reload',
          },
          {
            role: 'forcereload',
          },
          {
            label: i18n._(/* i18n */ { id: 'Developer' }),
            submenu: [
              {
                label: i18n._(/* i18n */ { id: 'Developer Tools' }),
                accelerator:
                  process.platform === 'darwin'
                    ? 'Alt+Command+I'
                    : 'Ctrl+Shift+I',
                click: () => mainWindow.toggleDevTools(),
              },
            ],
          },
          {
            type: 'separator',
          },
          {
            role: 'resetzoom',
          },
          {
            role: 'zoomin',
          },
          {
            role: 'zoomout',
          },
          {
            type: 'separator',
          },
          {
            label: i18n._(/* i18n */ { id: 'Full Screen' }),
            accelerator:
              process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
            click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()),
          },
        ],
      },
      {
        label: i18n._(/* i18n */ { id: 'Window' }),
        submenu: [
          {
            role: 'minimize',
          },
          {
            role: 'zoom',
          },
          {
            role: 'close',
          },
        ],
      },
      {
        label: i18n._(/* i18n */ { id: 'Help' }),
        role: 'help',
        submenu: [
          {
            label: i18n._(/* i18n */ { id: 'Moon Blockchain Wiki' }),
            click: () => {
              openExternal(
                'https://github.com/MOONCOINTEAM/moon-blockchain/wiki',
              );
            },
          },
          {
            label: i18n._(/* i18n */ { id: 'Frequently Asked Questions' }),
            click: () => {
              openExternal(
                'https://github.com/MOONCOINTEAM/moon-blockchain/wiki/FAQ',
              );
            },
          },
          {
            label: i18n._(/* i18n */ { id: 'Release Notes' }),
            click: () => {
              openExternal(
                'https://github.com/MOONCOINTEAM/moon-blockchain/releases',
              );
            },
          },
          {
            label: i18n._(/* i18n */ { id: 'Contribute on GitHub' }),
            click: () => {
              openExternal(
                'https://github.com/MOONCOINTEAM/moon-blockchain/blob/main/CONTRIBUTING.md',
              );
            },
          },
          {
            type: 'separator',
          },
          {
            label: i18n._(/* i18n */ { id: 'Report an Issue...' }),
            click: () => {
              openExternal(
                'https://github.com/MOONCOINTEAM/moon-blockchain/issues',
              );
            },
          },
          {
            label: i18n._(/* i18n */ { id: 'Chat on KeyBase' }),
            click: () => {
              openExternal('https://keybase.io/team/moon_network.public');
            },
          },
          {
            label: i18n._(/* i18n */ { id: 'Follow on Twitter' }),
            click: () => {
              openExternal('https://twitter.com/moon_project');
            },
          },
        ],
      },
    ];

    if (process.platform === 'darwin') {
      template.unshift({
        label: i18n._(/* i18n */ { id: 'Moon' }),
        submenu: [
          {
            label: i18n._(/* i18n */ { id: 'About Moon Blockchain' }),
            click: () => {
              openAbout();
            },
          },
          {
            type: 'separator',
          },
          {
            role: 'services',
          },
          {
            type: 'separator',
          },
          {
            role: 'hide',
          },
          {
            role: 'hideothers',
          },
          {
            role: 'unhide',
          },
          {
            type: 'separator',
          },
          {
            role: 'quit',
          },
        ],
      });

      template.splice(1, 1, {
        label: i18n._(/* i18n */ { id: 'File' }),
        submenu: [
          {
            role: 'close',
          },
        ],
      });

      template[2].submenu.push(
        {
          type: 'separator',
        },
        {
          label: i18n._(/* i18n */ { id: 'Speech' }),
          submenu: [
            {
              role: 'startspeaking',
            },
            {
              role: 'stopspeaking',
            },
          ],
        },
      );

      template.splice(4, 1, {
        role: 'window',
        submenu: [
          {
            role: 'minimize',
          },
          {
            role: 'zoom',
          },
          {
            type: 'separator',
          },
          {
            role: 'front',
          },
        ],
      });
    }

    if (process.platform === 'linux' || process.platform === 'win32') {
      template[4].submenu.push(
        {
          type: 'separator',
        },
        {
          label: i18n._(/* i18n */ { id: 'About Moon Blockchain' }),
          click() {
            openAbout();
          },
        },
      );
    }

    return template;
  };

  const openExternal = (url) => {
    shell.openExternal(url);
  };
}
