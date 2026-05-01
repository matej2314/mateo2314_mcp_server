export function isMcpModule(x) {
    return (typeof x === 'object' &&
        x !== null &&
        'register' in x &&
        typeof x.register === 'function');
}
