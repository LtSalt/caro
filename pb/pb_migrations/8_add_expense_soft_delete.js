/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const expenses = app.findCollectionByNameOrId("expenses");
    expenses.fields.add(new Field({ name: "deleted_at", type: "date", required: false }));
    app.save(expenses);
  },
  (app) => {
    const expenses = app.findCollectionByNameOrId("expenses");
    expenses.fields.removeByName("deleted_at");
    app.save(expenses);
  }
);
