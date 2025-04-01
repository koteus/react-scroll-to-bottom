/* eslint no-magic-numbers: ["error", { "ignore": [2] }] */

import { useContext } from 'react';
// import State2Context from '../ScrollToBottom/State2Context';

export default function useAnimating() {
  const { animating } = useContext(2);

  return [animating];
}
