/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("expenses");
    const field = collection.fields.find((f) => f.name === "split_type");
    if (field) {
      field.values = ["equal", "exact", "parts", "percentage"];
    }
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("expenses");
    const field = collection.fields.find((f) => f.name === "split_type");
    if (field) {
      field.values = ["equal", "exact", "percentage"];
    }
    app.save(collection);
  }
);
