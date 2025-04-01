import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import useInternalContext from '../hooks/internal/useInternalContext';
import styles from './Panel.module.css';

const Panel = ({ children, className = '' }) => {
  const { setTarget } = useInternalContext();

  return (
    <div className={classNames(styles.panel, className)} ref={setTarget}>
      {children}
    </div>
  );
};

Panel.propTypes = {
  children: PropTypes.any.isRequired,
  className: PropTypes.string
};

export default Panel;
