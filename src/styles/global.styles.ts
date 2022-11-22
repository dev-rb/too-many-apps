import { globalCss } from '@stitches/core';

export const globalStyles = globalCss({
  'html, body': {
    padding: 0,
    margin: 0,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
    width: '100%',
    height: '100%',
  },
  body: {
    backgroundColor: '$dark-7',
  },
  '*': {
    boxSizing: 'border-box',
  },
  'h1, h2, h3, h4, h5, h6, h7, h8': { margin: 0, padding: 0 },
});
