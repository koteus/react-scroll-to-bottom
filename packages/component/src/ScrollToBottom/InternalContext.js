import React from 'react';

const context = React.createContext({
  // eslint-disable-next-line no-unused-vars, no-empty-function
  observeScrollPosition: fn => () => {},
  setTarget: () => 0,
});

context.displayName = 'ScrollToBottomInternalContext';

export default context;
