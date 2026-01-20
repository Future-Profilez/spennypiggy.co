export default function html2canvas() {
    return Promise.resolve({
        width: 0,
        height: 0,
        toDataURL: () => '',
        getContext: () => ({
            fillRect: () => {},
            drawImage: () => {},
            getImageData: () => ({ data: [] }),
        })
    });
}
