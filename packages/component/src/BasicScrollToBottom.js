import PropTypes from 'prop-types';
import React from 'react';

import AutoHideFollowButton from './ScrollToBottom/AutoHideFollowButton';
import Composer from './ScrollToBottom/Composer';
import Panel from './ScrollToBottom/Panel';

function BasicScrollToBottomCore({ children, className = '', followButtonClassName = '', scrollViewClassName = '' }) {
  return (
    <div className={className} style={{ position: "relative" }}>
      <Panel className={scrollViewClassName}>{children}</Panel>
      <AutoHideFollowButton className={followButtonClassName} />
    </div>
  );
}

BasicScrollToBottomCore.propTypes = {
  children: PropTypes.any.isRequired,
  className: PropTypes.string,
  followButtonClassName: PropTypes.string,
  scrollViewClassName: PropTypes.string
};

const BasicScrollToBottom = ({
  checkInterval,
  children,
  className,
  debounce,
  debug,
  followButtonClassName,
  initialScrollBehavior = 'smooth',
  mode,
  scroller,
  scrollViewClassName
}) => (
  <Composer
    checkInterval={checkInterval}
    debounce={debounce}
    debug={debug}
    initialScrollBehavior={initialScrollBehavior}
    mode={mode}
    scroller={scroller}
  >
    <BasicScrollToBottomCore
      className={className}
      followButtonClassName={followButtonClassName}
      scrollViewClassName={scrollViewClassName}
    >
      {children}
    </BasicScrollToBottomCore>
  </Composer>
);

BasicScrollToBottom.propTypes = {
  checkInterval: PropTypes.number,
  children: PropTypes.any,
  className: PropTypes.string,
  debounce: PropTypes.number,
  debug: PropTypes.bool,
  followButtonClassName: PropTypes.string,
  initialScrollBehavior: PropTypes.oneOf(['auto', 'smooth']),
  mode: PropTypes.oneOf(['bottom', 'top']),
  scroller: PropTypes.func,
  scrollViewClassName: PropTypes.string
};

export default BasicScrollToBottom;
