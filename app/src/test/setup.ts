import '@testing-library/jest-dom'

// jsdom does not implement window.scrollTo; stub it to suppress "Not implemented" warnings.
window.scrollTo = () => {}
