import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';
import MoonIcon from './images/moon.svg';

export default function Keys(props: SvgIconProps) {
  return <SvgIcon component={MoonIcon} viewBox="0 0 150 58" {...props} />;
}
