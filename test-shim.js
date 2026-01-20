global.mockWindow = { name: 'mock' };
let hide = false;
Object.defineProperty(global, 'window', {
    get() { return hide ? undefined : global.mockWindow; },
    configurable: true
});

console.log('1. Hide=false, typeof window:', typeof window);
hide = true;
console.log('2. Hide=true, typeof window:', typeof window);
hide = false;
console.log('3. Hide=false, typeof window:', typeof window);
