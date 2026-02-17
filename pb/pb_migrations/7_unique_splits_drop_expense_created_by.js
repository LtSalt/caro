/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. Add unique index on expense_splits (expense, user)
    const expenseSplits = app.findCollectionByNameOrId("expense_splits");
    expenseSplits.indexes = [
      'CREATE UNIQUE INDEX idx_expense_user ON expense_splits ("expense", "user")',
    ];
    app.save(expenseSplits);

    // 2. Remove created_by from expenses
    const expenses = app.findCollectionByNameOrId("expenses");
    expenses.fields.removeByName("created_by");
    app.save(expenses);
  },
  (app) => {
    // Reverse: remove index, re-add created_by
    const expenseSplits = app.findCollectionByNameOrId("expense_splits");
    expenseSplits.indexes = [];
    app.save(expenseSplits);

    const expenses = app.findCollectionByNameOrId("expenses");
    expenses.fields.add(
      new Field({
        name: "created_by",
        type: "relation",
        required: false,
        collectionId: "_pb_users_auth_",
        maxSelect: 1,
        cascadeDelete: false,
      })
    );
    app.save(expenses);
  }
);
