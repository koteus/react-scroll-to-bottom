/* eslint no-magic-numbers: "off" */

import React, { useCallback, useState } from 'react';

import {
  useScrollTo,
  useScrollToBottom,
  useScrollToEnd,
  useScrollToStart,
  useScrollToTop
} from 'react-scroll-to-bottom';

import styles from './CommandBar.module.css';

const CommandBar = () => {
  const scrollTo = useScrollTo();
  const scrollToBottom = useScrollToBottom();
  const scrollToEnd = useScrollToEnd();
  const scrollToStart = useScrollToStart();
  const scrollToTop = useScrollToTop();
  const [options, setOptions] = useState({ behavior: 'smooth' });

  const handleScrollTo100pxClick = useCallback(() => scrollTo(100, options), [options, scrollTo]);
  const handleScrollToBottomClick = useCallback(() => scrollToBottom(options), [options, scrollToBottom]);
  const handleScrollToEndClick = useCallback(() => scrollToEnd(options), [options, scrollToEnd]);
  const handleScrollToStartClick = useCallback(() => scrollToStart(options), [options, scrollToStart]);
  const handleScrollToTopClick = useCallback(() => scrollToTop(options), [options, scrollToTop]);
  const handleSmoothChange = useCallback(
    ({ target: { checked } }) => {
      setOptions({ behavior: checked ? 'smooth' : 'auto' });
    },
    [setOptions]
  );

  return (
    <div className={styles.commandBar}>
      <ul className={styles.actions}>
        <li>
          <button className={styles.action} onClick={handleScrollToBottomClick}>
            Scroll to bottom
          </button>
        </li>
        <li>
          <button className={styles.action} onClick={handleScrollToTopClick}>
            Scroll to top
          </button>
        </li>
        <li>
          <button className={styles.action} onClick={handleScrollToStartClick}>
            Scroll to start
          </button>
        </li>
        <li>
          <button className={styles.action} onClick={handleScrollToEndClick}>
            Scroll to end
          </button>
        </li>
        <li>
          <button className={styles.action} onClick={handleScrollTo100pxClick}>
            100px
          </button>
        </li>
        <li>
          <label>
            <input checked={options.behavior === 'smooth'} onChange={handleSmoothChange} type="checkbox" />
            Smooth
          </label>
        </li>
      </ul>
    </div>
  );
};

export default CommandBar;
