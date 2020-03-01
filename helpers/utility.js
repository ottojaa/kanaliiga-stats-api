exports.randomNumber = function(length) {
  var text = "";
  var possible = "123456789";
  for (var i = 0; i < length; i++) {
    var sup = Math.floor(Math.random() * possible.length);
    text += i > 0 && sup == i ? "0" : possible.charAt(sup);
  }
  return Number(text);
};

exports.applyDataToModel = function(model, data) {
  const subModels = [];

  model.$.schema.fields.forEach(i => {
    if (i.type.inspect().indexOf("ModelRef") === 0 && data[i.name]) {
      applyDataToModel(model[i.name], data[i.name]);
      subModels.push(i.name);
    }
  });

  subModels.forEach(i => delete data[i]);

  model.$.schema.applyDataToObject(model, data);
};
