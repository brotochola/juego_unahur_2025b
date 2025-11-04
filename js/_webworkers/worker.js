self.addEventListener("message", (e) => {
  let date = performance.now();

  try {
    let func = eval(e.data.func);
    let resp = func(e.data.dataToPass);
    self.postMessage({
      msg: "listo",
      resp: resp,
      timeItTook: performance.now() - date,
    });
  } catch (err) {
    self.postMessage({ msg: "error", err });
  }

  // return arr;
});
