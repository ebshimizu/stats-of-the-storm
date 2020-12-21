module.exports = {
  median(arr) {
    const len = arr.length;
    arr.sort((a, b) => a - b);

    if (len % 2 === 0) {
      return (arr[len / 2 - 1] + arr[len / 2]) / 2;
    }

    return arr[(len - 1) / 2];
  },
};
