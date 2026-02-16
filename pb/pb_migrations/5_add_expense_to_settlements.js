/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const expenses = app.findCollectionByNameOrId("expenses");
    const collection = app.findCollectionByNameOrId("settlements");
    collection.fields.add(
      new Field({
        name: "expense",
        type: "relation",
        required: false,
        collectionId: expenses.id,
        maxSelect: 1,
        cascadeDelete: true,
      })
    );
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("settlements");
    collection.fields.removeByName("expense");
    app.save(collection);
  }
);
