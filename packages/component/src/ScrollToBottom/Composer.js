/* eslint no-magic-numbers: ["off"] */

import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import createDebug from '../utils/debug';
import EventSpy from '../EventSpy';
import FunctionContext from './FunctionContext';
import InternalContext from './InternalContext';
import SpineTo from '../SpineTo';
import State1Context from './State1Context';
import State2Context from './State2Context';
import StateContext from './StateContext';
import styleConsole from '../utils/styleConsole';
import useStateRef from '../hooks/internal/useStateRef';

const DEFAULT_SCROLLER = () => Infinity;
const MIN_CHECK_INTERVAL = 17; // 1 frame
const MODE_BOTTOM = 'bottom';
const MODE_TOP = 'top';
const NEAR_END_THRESHOLD = 1;
const SCROLL_DECISION_DURATION = 34; // 2 frames

function setImmediateInterval(fn, ms) {
  fn();

  return setInterval(fn, ms);
}

function computeViewState({ mode, target: { offsetHeight, scrollHeight, scrollTop } }) {
  const atBottom = scrollHeight - scrollTop - offsetHeight < NEAR_END_THRESHOLD;
  const atTop = scrollTop < NEAR_END_THRESHOLD;

  const atEnd = mode === MODE_TOP ? atTop : atBottom;
  const atStart = mode !== MODE_TOP ? atTop : atBottom;

  return {
    atBottom,
    atEnd,
    atStart,
    atTop
  };
}

function isEnd(animateTo, mode) {
  return animateTo === (mode === MODE_TOP ? 0 : '100%');
}

const Composer = ({
  checkInterval = 100,
  children,
  debounce = 17,
  debug: debugFromProp,
  initialScrollBehavior = 'smooth',
  mode,
  scroller = DEFAULT_SCROLLER
}) => {
  const debug = useMemo(() => createDebug(`<ScrollToBottom>`, { force: debugFromProp }), [debugFromProp]);

  mode = mode === MODE_TOP ? MODE_TOP : MODE_BOTTOM;

  const ignoreScrollEventBeforeRef = useRef(0);
  const initialScrollBehaviorRef = useRef(initialScrollBehavior);
  const [animateTo, setAnimateTo, animateToRef] = useStateRef(mode === MODE_TOP ? 0 : '100%');
  const [target, setTarget, targetRef] = useStateRef(null);

  // Internal context
  const animateFromRef = useRef(0);
  const offsetHeightRef = useRef(0);
  const scrollHeightRef = useRef(0);

  // State context
  const [atBottom, setAtBottom] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const [atStart, setAtStart] = useState(false);
  const [sticky, setSticky, stickyRef] = useStateRef(true);

  // High-rate state context
  const scrollPositionObserversRef = useRef([]);
  const observeScrollPosition = useCallback(
    fn => {
      const { current: target } = targetRef;

      scrollPositionObserversRef.current.push(fn);
      target && fn({ scrollTop: target.scrollTop });

      return () => {
        const { current: scrollPositionObservers } = scrollPositionObserversRef;
        const index = scrollPositionObservers.indexOf(fn);

        if (index !== -1) {
          scrollPositionObservers.splice(index, 1);
        }
      };
    },
    [scrollPositionObserversRef, targetRef]
  );

  const handleSpineToEnd = useCallback(() => {
    const { current: animateTo } = animateToRef;

    debug(() => [
      '%cSpineTo%c: %conEnd%c is fired.',
      ...styleConsole('magenta'),
      ...styleConsole('orange'),
      { animateTo }
    ]);

    ignoreScrollEventBeforeRef.current = Date.now();

    // handleScrollEnd may end at a position which should lose stickiness.
    // In that case, we will need to set sticky to false to stop the interval check.
    // Test case:
    // 1. Add a scroller that always return 0
    // 2. Show a panel with mode === MODE_BOTTOM
    // 3. Programmatically scroll to 0 (set element.scrollTop = 0)
    // Expected: it should not repetitively call scrollTo(0)
    //           it should set stickiness to false

    isEnd(animateTo, mode) || setSticky(false);
    setAnimateTo(null);
  }, [animateToRef, debug, ignoreScrollEventBeforeRef, mode, setAnimateTo, setSticky]);

  // Function context
  const scrollTo = useCallback(
    (nextAnimateTo, { behavior } = {}) => {
      const { current: target } = targetRef;

      if (typeof nextAnimateTo !== 'number' && nextAnimateTo !== '100%') {
        return console.warn('react-scroll-to-bottom: Arguments passed to scrollTo() must be either number or "100%".');
      }

      // If it is trying to scroll to a position which is not "atEnd", it should set sticky to false after scroll ended.

      debug(() => [
        [
          `%cscrollTo%c: Will scroll to %c${
            typeof nextAnimateTo === 'number' ? nextAnimateTo + 'px' : nextAnimateTo.replace(/%/gu, '%%')
          }%c`,
          ...styleConsole('lime', ''),
          ...styleConsole('purple')
        ],
        {
          behavior,
          nextAnimateTo,
          target
        }
      ]);

      if (behavior === 'auto') {
        // Stop any existing animation
        handleSpineToEnd();

        if (target) {
          // Jump to the scroll position
          target.scrollTop = nextAnimateTo === '100%' ? target.scrollHeight - target.offsetHeight : nextAnimateTo;
        }
      } else {
        behavior !== 'smooth' &&
          console.warn(
            'react-scroll-to-bottom: Please set "behavior" when calling "scrollTo". In future versions, the default behavior will be changed from smooth scrolling to discrete scrolling to align with HTML Standard.'
          );

        setAnimateTo(nextAnimateTo);
      }

      // This is for handling a case. When calling scrollTo('100%', { behavior: 'auto' }) multiple times, it would lose stickiness.
      if (isEnd(nextAnimateTo, mode)) {
        debug(() => [
          [
            `%cscrollTo%c: Scrolling to end, will set sticky to %ctrue%c.`,
            ...styleConsole('lime', ''),
            ...styleConsole('purple')
          ],
          [{ mode, nextAnimateTo }]
        ]);

        setSticky(true);
      }
    },
    [debug, handleSpineToEnd, mode, setAnimateTo, setSticky, targetRef]
  );

  const scrollToBottom = useCallback(
    ({ behavior } = {}) => {
      debug(() => ['%cscrollToBottom%c: Called', ...styleConsole('yellow', '')]);

      behavior !== 'smooth' &&
        console.warn(
          'react-scroll-to-bottom: Please set "behavior" when calling "scrollToBottom". In future versions, the default behavior will be changed from smooth scrolling to discrete scrolling to align with HTML Standard.'
        );

      scrollTo('100%', { behavior: behavior || 'smooth' });
    },
    [debug, scrollTo]
  );

  const scrollToTop = useCallback(
    ({ behavior } = {}) => {
      debug(() => ['%cscrollToTop%c: Called', ...styleConsole('yellow', '')]);

      behavior !== 'smooth' &&
        console.warn(
          'react-scroll-to-bottom: Please set "behavior" when calling "scrollToTop". In future versions, the default behavior will be changed from smooth scrolling to discrete scrolling to align with HTML Standard.'
        );

      scrollTo(0, { behavior: behavior || 'smooth' });
    },
    [debug, scrollTo]
  );

  const scrollToEnd = useCallback(
    ({ behavior } = {}) => {
      debug(() => ['%cscrollToEnd%c: Called', ...styleConsole('yellow', '')]);

      behavior !== 'smooth' &&
        console.warn(
          'react-scroll-to-bottom: Please set "behavior" when calling "scrollToEnd". In future versions, the default behavior will be changed from smooth scrolling to discrete scrolling to align with HTML Standard.'
        );

      const options = { behavior: behavior || 'smooth' };

      mode === MODE_TOP ? scrollToTop(options) : scrollToBottom(options);
    },
    [debug, mode, scrollToBottom, scrollToTop]
  );

  const scrollToStart = useCallback(
    ({ behavior } = {}) => {
      debug(() => ['%cscrollToStart%c: Called', ...styleConsole('yellow', '')]);

      behavior !== 'smooth' &&
        console.warn(
          'react-scroll-to-bottom: Please set "behavior" when calling "scrollToStart". In future versions, the default behavior will be changed from smooth scrolling to discrete scrolling to align with HTML Standard.'
        );

      const options = { behavior: behavior || 'smooth' };

      mode === MODE_TOP ? scrollToBottom(options) : scrollToTop(options);
    },
    [debug, mode, scrollToBottom, scrollToTop]
  );

  const scrollToSticky = useCallback(() => {
    const { current: target } = targetRef;

    if (target) {
      if (initialScrollBehaviorRef.current === 'auto') {
        debug(() => [`%ctarget changed%c: Initial scroll`, ...styleConsole('blue')]);

        target.scrollTop = mode === MODE_TOP ? 0 : target.scrollHeight - target.offsetHeight;
        initialScrollBehaviorRef.current = '';

        return;
      }

      // This is very similar to scrollToEnd().
      // Instead of scrolling to end, it will call props.scroller() to determines how far it should scroll.
      // This function could be called while it is auto-scrolling.

      const { current: animateFrom } = animateFromRef;
      const { offsetHeight, scrollHeight, scrollTop } = target;

      const maxValue = mode === MODE_TOP ? 0 : Math.max(0, scrollHeight - offsetHeight - scrollTop);
      const minValue = Math.max(0, animateFrom - scrollTop);

      // @ts-ignore - scroller function accepts object argument with scroll metrics
      const rawNextValue = scroller({ maxValue, minValue, offsetHeight, scrollHeight, scrollTop });

      const nextValue = Math.max(0, Math.min(maxValue, rawNextValue));

      let nextAnimateTo;

      if (mode === MODE_TOP || nextValue !== maxValue) {
        nextAnimateTo = scrollTop + nextValue;
      } else {
        // When scrolling to bottom, we should scroll to "100%".
        // Otherwise, if we scroll to any number, it will lose stickiness when elements are adding too fast.
        // "100%" is a special argument intended to make sure stickiness is not lost while new elements are being added.
        nextAnimateTo = '100%';
      }

      debug(() => [
        [
          `%cscrollToSticky%c: Will animate from %c${animateFrom}px%c to %c${
            typeof nextAnimateTo === 'number' ? nextAnimateTo + 'px' : nextAnimateTo.replace(/%/gu, '%%')
          }%c (%c${(nextAnimateTo === '100%' ? maxValue : nextAnimateTo) + animateFrom}px%c)`,
          ...styleConsole('orange'),
          ...styleConsole('purple'),
          ...styleConsole('purple'),
          ...styleConsole('purple')
        ],
        {
          animateFrom,
          maxValue,
          minValue,
          nextAnimateTo,
          nextValue,
          offsetHeight,
          rawNextValue,
          scrollHeight,
          scrollTop
        }
      ]);

      scrollTo(nextAnimateTo, { behavior: 'smooth' });
    }
  }, [animateFromRef, debug, mode, scroller, scrollTo, targetRef]);

  const handleScroll = useCallback(
    ({ timeStampLow }) => {
      const { current: animateTo } = animateToRef;
      const { current: target } = targetRef;

      const animating = animateTo !== null;

      // Currently, there are no reliable way to check if the "scroll" event is trigger due to
      // user gesture, programmatic scrolling, or Chrome-synthesized "scroll" event to compensate size change.
      // Thus, we use our best-effort to guess if it is triggered by user gesture, and disable sticky if it is heading towards the start direction.

      if (timeStampLow <= ignoreScrollEventBeforeRef.current || !target) {
        // Since we debounce "scroll" event, this handler might be called after spineTo.onEnd (a.k.a. artificial scrolling).
        // We should ignore debounced event fired after scrollEnd, because without skipping them, the userInitiatedScroll calculated below will not be accurate.
        // Thus, on a fast machine, adding elements super fast will lose the "stickiness".

        return;
      }

      const { atBottom, atEnd, atStart, atTop } = computeViewState({ mode, target });

      setAtBottom(atBottom);
      setAtEnd(atEnd);
      setAtStart(atStart);
      setAtTop(atTop);

      // Chrome will emit "synthetic" scroll event if the container is resized or an element is added
      // We need to ignore these "synthetic" events
      // Repro: In playground, press 4-1-5-1-1 (small, add one, normal, add one, add one)
      //        Nomatter how fast or slow the sequence is being pressed, it should still stick to the bottom
      const { offsetHeight: nextOffsetHeight, scrollHeight: nextScrollHeight } = target;
      const { current: offsetHeight } = offsetHeightRef;
      const { current: scrollHeight } = scrollHeightRef;
      const offsetHeightChanged = nextOffsetHeight !== offsetHeight;
      const scrollHeightChanged = nextScrollHeight !== scrollHeight;

      if (offsetHeightChanged) {
        offsetHeightRef.current = nextOffsetHeight;
      }

      if (scrollHeightChanged) {
        scrollHeightRef.current = nextScrollHeight;
      }

      // Sticky means:
      // - If it is scrolled programatically, we are still in sticky mode
      // - If it is scrolled by the user, then sticky means if we are at the end

      // Only update stickiness if the scroll event is not due to synthetic scroll done by Chrome
      if (!offsetHeightChanged && !scrollHeightChanged) {
        // We are sticky if we are animating to the end, or we are already at the end.
        // We can be "animating but not sticky" by calling "scrollTo(100)" where the container scrollHeight is 200px.
        const nextSticky = (animating && isEnd(animateTo, mode)) || atEnd;

        if (stickyRef.current !== nextSticky) {
          debug(() => [
            [
              `%conScroll%c: %csetSticky%c(%c${nextSticky}%c)`,
              ...styleConsole('red'),
              ...styleConsole('red'),
              ...styleConsole('purple')
            ],
            [
              `(animating = %c${animating}%c && isEnd = %c${isEnd(animateTo, mode)}%c) || atEnd = %c${atEnd}%c`,
              ...styleConsole('purple'),
              ...styleConsole('purple'),
              ...styleConsole('purple'),
              {
                animating,
                animateTo,
                atEnd,
                mode,
                offsetHeight: target.offsetHeight,
                scrollHeight: target.scrollHeight,
                sticky: stickyRef.current,
                nextSticky
              }
            ]
          ]);

          setSticky(nextSticky);
        }
      } else if (stickyRef.current) {
        debug(() => [
          [
            `%conScroll%c: Size changed while sticky, calling %cscrollToSticky()%c`,
            ...styleConsole('red'),
            ...styleConsole('orange'),
            {
              offsetHeightChanged,
              scrollHeightChanged
            }
          ],
          {
            nextOffsetHeight,
            prevOffsetHeight: offsetHeight,
            nextScrollHeight,
            prevScrollHeight: scrollHeight
          }
        ]);

        scrollToSticky();
      }

      const { scrollTop: actualScrollTop } = target;

      scrollPositionObserversRef.current.forEach(observer => observer({ scrollTop: actualScrollTop }));
    },
    [
      animateToRef,
      debug,
      ignoreScrollEventBeforeRef,
      mode,
      offsetHeightRef,
      scrollHeightRef,
      scrollPositionObserversRef,
      scrollToSticky,
      setAtBottom,
      setAtEnd,
      setAtStart,
      setAtTop,
      setSticky,
      stickyRef,
      targetRef
    ]
  );

  useEffect(() => {
    if (target) {
      let stickyButNotAtEndSince = null;

      const timeout = setImmediateInterval(() => {
        const { current: target } = targetRef;
        const animating = animateToRef.current !== null;

        if (stickyRef.current) {
          if (!computeViewState({ mode, target }).atEnd) {
            if (!stickyButNotAtEndSince) {
              stickyButNotAtEndSince = Date.now();
            } else if (Date.now() - stickyButNotAtEndSince > SCROLL_DECISION_DURATION) {
              // Quirks: In Firefox, after user scroll down, Firefox do two things:
              //         1. Set to a new "scrollTop"
              //         2. Fire "scroll" event
              //         For what we observed, #1 is fired about 20ms before #2. There is a chance that this stickyCheckTimeout is being scheduled between 1 and 2.
              //         That means, if we just look at #1 to decide if we should scroll, we will always scroll, in oppose to the user's intention.
              // Repro: Open Firefox, set checkInterval to a lower number, and try to scroll by dragging the scroll handler. It will jump back.

              // The "animating" check will make sure stickiness is not lost when elements are adding at a very fast pace.
              if (!animating) {
                animateFromRef.current = target.scrollTop;

                debug(() => [
                  `%cInterval check%c: Should sticky but not at end, calling %cscrollToSticky()%c to scroll`,
                  ...styleConsole('navy'),
                  ...styleConsole('orange')
                ]);

                scrollToSticky();
              }

              stickyButNotAtEndSince = null;
            }
          } else {
            stickyButNotAtEndSince = null;
          }
        } else if (target.scrollHeight <= target.offsetHeight && !stickyRef.current) {
          // When the container is emptied, we will set sticky back to true.

          debug(() => [
            [
              `%cInterval check%c: Container is emptied, setting sticky back to %ctrue%c`,
              ...styleConsole('navy'),
              ...styleConsole('purple')
            ],
            [
              {
                offsetHeight: target.offsetHeight,
                scrollHeight: target.scrollHeight,
                sticky: stickyRef.current
              }
            ]
          ]);

          setSticky(true);
        }
      }, Math.max(MIN_CHECK_INTERVAL, checkInterval) || MIN_CHECK_INTERVAL);

      // Return cleanup function for the interval
      return () => {
        // @ts-ignore - Handle Timer vs Timeout type mismatch
        clearInterval(timeout);
      };
    }
  }, [animateToRef, checkInterval, debug, mode, scrollToSticky, setSticky, stickyRef, target, targetRef]);

  const internalContext = useMemo(
    () => ({
      observeScrollPosition,
      setTarget,
    }),
    [observeScrollPosition, setTarget]
  );

  const state1Context = useMemo(
    () => ({
      atBottom,
      atEnd,
      atStart,
      atTop,
      mode
    }),
    [atBottom, atEnd, atStart, atTop, mode]
  );

  const state2Context = useMemo(() => {
    const animating = animateTo !== null;

    return {
      animating,
      animatingToEnd: animating && isEnd(animateTo, mode),
      sticky
    };
  }, [animateTo, mode, sticky]);

  const combinedStateContext = useMemo(
    () => ({
      ...state1Context,
      ...state2Context
    }),
    [state1Context, state2Context]
  );

  const functionContext = useMemo(
    () => ({
      // @ts-ignore - Type compatibility between functions
      scrollTo: (...args) => {
        scrollTo(...args);
        return 0;
      },
      // @ts-ignore - Type compatibility between functions
      scrollToBottom: (...args) => {
        scrollToBottom(...args);
        return 0;
      },
      // @ts-ignore - Type compatibility between functions
      scrollToEnd: (...args) => {
        scrollToEnd(...args);
        return 0;
      },
      // @ts-ignore - Type compatibility between functions
      scrollToStart: (...args) => {
        scrollToStart(...args);
        return 0;
      },
      // @ts-ignore - Type compatibility between functions
      scrollToTop: (...args) => {
        scrollToTop(...args);
        return 0;
      }
    }),
    [scrollTo, scrollToBottom, scrollToEnd, scrollToStart, scrollToTop]
  );

  useEffect(() => {
    // We need to update the "scrollHeight" value to latest when the user do a focus inside the box.
    //
    // This is because:
    // - In our code that mitigate Chrome synthetic scrolling, that code will look at whether "scrollHeight" value is latest or not.
    // - That code only run on "scroll" event.
    // - That means, on every "scroll" event, if the "scrollHeight" value is not latest, we will skip modifying the stickiness.
    // - That means, if the user "focus" to an element that cause the scroll view to scroll to the bottom, the user agent will fire "scroll" event.
    //   Since the "scrollHeight" is not latest value, this "scroll" event will be ignored and stickiness will not be modified.
    // - That means, if the user "focus" to a newly added element that is at the end of the scroll view, the "scroll to bottom" button will continue to show.
    //
    // Repro in Chrome:
    // 1. Fill up a scroll view
    // 2. Scroll up, the "scroll to bottom" button should show up
    // 3. Click "Add a button"
    // 4. Click on the scroll view (to pseudo-focus on it)
    // 5. Press TAB, the scroll view will be at the bottom
    //
    // Expect:
    // - The "scroll to bottom" button should be gone.
    if (target) {
      const handleFocus = () => {
        scrollHeightRef.current = target.scrollHeight;
      };

      target.addEventListener('focus', handleFocus, { capture: true, passive: true });

      return () => target.removeEventListener('focus', handleFocus);
    }
  }, [target]);

  debug(() => [
    [`%cRender%c: Render`, ...styleConsole('cyan', '')],
    {
      animateTo,
      animating: animateTo !== null,
      sticky,
      target
    }
  ]);

  return (
    <InternalContext.Provider value={internalContext}>
      <FunctionContext.Provider value={functionContext}>
        <StateContext.Provider value={combinedStateContext}>
          <State1Context.Provider value={state1Context}>
            <State2Context.Provider value={state2Context}>
              {children}
              {target && (
                // @ts-ignore - EventSpy returns false but is used as a component
                <React.Fragment>{<EventSpy debounce={debounce} name="scroll" onEvent={handleScroll} target={target} />}</React.Fragment>
              )}
              {target && animateTo !== null && (
                // @ts-ignore - SpineTo returns false but is used as a component
                <React.Fragment>{<SpineTo name="scrollTop" onEnd={handleSpineToEnd} target={target} value={animateTo} />}</React.Fragment>
              )}
            </State2Context.Provider>
          </State1Context.Provider>
        </StateContext.Provider>
      </FunctionContext.Provider>
    </InternalContext.Provider>
  );
};

Composer.propTypes = {
  checkInterval: PropTypes.number,
  children: PropTypes.any,
  debounce: PropTypes.number,
  debug: PropTypes.bool,
  initialScrollBehavior: PropTypes.oneOf(['auto', 'smooth']),
  mode: PropTypes.oneOf(['bottom', 'top']),
  scroller: PropTypes.func
};

export default Composer;
