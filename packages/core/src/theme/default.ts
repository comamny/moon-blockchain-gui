import { grey } from '@mui/material/colors';
import { alpha, createTheme } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    grey: true;
  }
}

declare module '@mui/material' {
  interface Color {
    main: string;
    dark: string;
  }
}

const greyTheme = {
  palette: {
    grey: {
      main: grey[300],
      dark: grey[400],
    },
  },
};

const theme = createTheme(greyTheme);

export default deepmerge(greyTheme, {
  palette: {
    background: {
      default: '#fafafa',
    },
    primary: {
      main: '#6AAFF5', // '#4A90E2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#000000',
      contrastText: '#ffffff',
    },
    danger: {
      main: '#dc3545',
      contrastText: '#ffffff',
    },
    highlight: {
      main: '#4A90E2',
    },
    border: {
      main: '#E0E0E0',
      dark: '#484747',
    },
    sidebarBackground: {
      main: '#E8EAF5',
      dark: '#4E505C',
    },
    sidebarIconSelected: {
      main: '#014770',
      dark: '#6AAFF5',
    },
    sidebarIcon: {
      main: '#9E9E9E',
      dark: '#9E9E9E',
    },
    sidebarIconHover: {
      main: '#424242',
      dark: 'white',
    },
  },
  drawer: {
    width: '72px',
  },
  mixins: {
    toolbar: {
      minHeight: '90px',
    },
  },
  components: {
    MuiSvgIcon: {
      variants: [
        {
          props: { fontSize: 'extraLarge' },
          style: {
            fontSize: '3rem',
          },
        },
        {
          props: { fontSize: 'sidebarIcon' },
          style: {
            fontSize: '2rem',
          },
        },
      ],
    },
    MuiTypography: {
      variants: [
        {
          props: { variant: 'h6' },
          style: {
            fontWeight: 400,
          },
        },
      ],
    },
    MuiChip: {
      variants: [
        {
          props: { size: 'extraSmall' },
          style: {
            height: '20px',
            fontSize: '0.75rem',
            '.MuiChip-label': {
              paddingLeft: '6px',
              paddingRight: '6px',
            },
          },
        },
      ],
    },
    MuiButton: {
      variants: [
        {
          props: { variant: 'contained', color: 'grey' },
          style: {
            color: theme.palette.getContrastText(theme.palette.grey[300]),
          },
        },
        {
          props: { variant: 'outlined', color: 'grey' },
          style: {
            color: theme.palette.text.primary,
            borderColor:
              theme.palette.mode === 'light'
                ? 'rgba(0, 0, 0, 0.23)'
                : 'rgba(255, 255, 255, 0.23)',
            '&.Mui-disabled': {
              border: `1px solid ${theme.palette.action.disabledBackground}`,
            },
            '&:hover': {
              borderColor:
                theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.23)'
                  : 'rgba(255, 255, 255, 0.23)',
              backgroundColor: alpha(
                theme.palette.text.primary,
                theme.palette.action.hoverOpacity
              ),
            },
          },
        },
        {
          props: { color: 'grey', variant: 'text' },
          style: {
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: alpha(
                theme.palette.text.primary,
                theme.palette.action.hoverOpacity
              ),
            },
          },
        },
      ],
    },
  },
});
