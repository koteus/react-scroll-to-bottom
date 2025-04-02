import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import useScrollToEnd from '../hooks/useScrollToEnd';
import useSticky from '../hooks/useSticky';
import styles from './AutoHideFollowButton.module.css';

const AutoHideFollowButton = ({ children = null, className = '' }) => {
  const [sticky] = useSticky();
  const scrollToEnd = useScrollToEnd();

  return (
    !sticky && (
      <button className={classNames(styles.button, className)} onClick={scrollToEnd} type="button">
        {children}
      </button>
    )
  );
};

AutoHideFollowButton.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string
};

export default AutoHideFollowButton;
