/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("expense_splits");
    collection.fields.add(
      new Field({
        name: "parts",
        type: "number",
        required: false,
      })
    );
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("expense_splits");
    collection.fields.removeByName("parts");
    app.save(collection);
  }
);
