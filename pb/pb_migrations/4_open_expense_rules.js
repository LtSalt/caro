/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("expenses");
    collection.updateRule = '@request.auth.id != ""';
    collection.deleteRule = '@request.auth.id != ""';
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("expenses");
    collection.updateRule = '@request.auth.id != "" && @request.auth.id = created_by';
    collection.deleteRule = '@request.auth.id != "" && @request.auth.id = created_by';
    app.save(collection);
  }
);
