import PlotterName from './PlotterName';
import optionsForPlotter from '../utils/optionsForPlotter';
import defaultsForPlotter from '../utils/defaultsForPlotter';

export default {
  displayName: 'Moon Proof of Space',
  options: optionsForPlotter(PlotterName.MOONPOS),
  defaults: defaultsForPlotter(PlotterName.MOONPOS),
  installInfo: { installed: true },
};
