import classNames from 'classnames';
import React, { useRef } from 'react';

import {
  useAnimating,
  useAnimatingToEnd,
  useAtBottom,
  useAtEnd,
  useAtStart,
  useAtTop,
  useMode,
  useObserveScrollPosition,
  useSticky
} from 'react-scroll-to-bottom';

import styles from './StatusBar.module.css';

const StatusBar = ({ className }) => {
  const scrollTopRef = useRef();
  const [animating] = useAnimating();
  const [animatingToEnd] = useAnimatingToEnd();
  const [atBottom] = useAtBottom();
  const [atEnd] = useAtEnd();
  const [atStart] = useAtStart();
  const [atTop] = useAtTop();
  const [mode] = useMode();
  const [sticky] = useSticky();

  useObserveScrollPosition(
    ({ scrollTop }) => {
      const { current } = scrollTopRef;

      // We are directly writing to "innerText" for performance reason.
      if (current) {
        current.innerText = scrollTop + 'px';
      }
    },
    [scrollTopRef]
  );

  return (
    <div className={classNames(styles.statusBar, className)}>
      <ul className={styles.badges}>
        <li className={classNames(styles.badge, { [styles.badgeLitGreen]: mode !== 'top' })}>
          STICK TO BOTTOM
        </li>
        <li className={classNames(styles.badge, { [styles.badgeLit]: animating })}>ANIMATING</li>
        <li className={classNames(styles.badge, { [styles.badgeLit]: animatingToEnd })}>
          ANIMATING TO END
        </li>
        <li className={classNames(styles.badge, { [styles.badgeLit]: atBottom })}>AT BOTTOM</li>
        <li className={classNames(styles.badge, { [styles.badgeLit]: atEnd })}>AT END</li>
        <li className={classNames(styles.badge, { [styles.badgeLit]: atStart })}>AT START</li>
        <li className={classNames(styles.badge, { [styles.badgeLit]: atTop })}>AT TOP</li>
        <li className={classNames(styles.badge, { [styles.badgeLit]: sticky })}>STICKY</li>
        <li className={styles.badge} ref={scrollTopRef}></li>
      </ul>
    </div>
  );
};

export default StatusBar;
