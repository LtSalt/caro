/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // ── 1. Add `members` field to groups ──
    const groups = app.findCollectionByNameOrId("groups");
    groups.fields.add(
      new Field({
        name: "members",
        type: "relation",
        required: true,
        collectionId: "_pb_users_auth_",
        maxSelect: 999,
        cascadeDelete: false,
      })
    );
    app.save(groups);

    // ── 2. Add `settled` and `settled_at` fields to expenses ──
    const expenses = app.findCollectionByNameOrId("expenses");
    expenses.fields.add(
      new Field({
        name: "settled",
        type: "bool",
      })
    );
    expenses.fields.add(
      new Field({
        name: "settled_at",
        type: "date",
        required: false,
      })
    );
    app.save(expenses);

    // ── 3. Backfill groups.members from group_members ──
    const allGroups = app.findRecordsByFilter("groups", "1=1");
    for (const group of allGroups) {
      const memberships = app.findRecordsByFilter(
        "group_members",
        `group = "${group.id}"`
      );
      const userIds = memberships.map((m) => m.get("user"));
      group.set("members", userIds);
      app.save(group);
    }

    // ── 4. Backfill expenses.settled from settlements ──
    let allSettlements = [];
    try {
      allSettlements = app.findRecordsByFilter("settlements", "1=1");
    } catch (e) {
      // no settlements
    }
    const settledExpenseIds = new Set();
    const settledDates = {};
    for (const s of allSettlements) {
      const expenseId = s.get("expense");
      if (expenseId) {
        settledExpenseIds.add(expenseId);
        settledDates[expenseId] = s.get("date");
      }
    }
    for (const expenseId of settledExpenseIds) {
      try {
        const expense = app.findRecordById("expenses", expenseId);
        expense.set("settled", true);
        expense.set("settled_at", settledDates[expenseId]);
        app.save(expense);
      } catch (e) {
        // expense may have been deleted
      }
    }

    // ── 5. Drop settlements and group_members ──
    app.delete(app.findCollectionByNameOrId("settlements"));
    app.delete(app.findCollectionByNameOrId("group_members"));
  },
  (app) => {
    // Reverse: recreate group_members and settlements, remove new fields
    const groups = app.findCollectionByNameOrId("groups");
    const expenses = app.findCollectionByNameOrId("expenses");

    // Recreate group_members
    const groupMembers = new Collection({
      name: "group_members",
      type: "base",
      fields: [
        {
          name: "group",
          type: "relation",
          required: true,
          collectionId: groups.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: "user",
          type: "relation",
          required: true,
          collectionId: "_pb_users_auth_",
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: "role",
          type: "select",
          required: true,
          values: ["owner", "member"],
          maxSelect: 1,
        },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_group_user ON group_members ("group", "user")',
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    });
    app.save(groupMembers);

    // Recreate settlements
    const settlements = new Collection({
      name: "settlements",
      type: "base",
      fields: [
        {
          name: "group",
          type: "relation",
          required: true,
          collectionId: groups.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: "paid_by",
          type: "relation",
          required: true,
          collectionId: "_pb_users_auth_",
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: "paid_to",
          type: "relation",
          required: true,
          collectionId: "_pb_users_auth_",
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: "amount", type: "number", required: true, min: 0.01 },
        { name: "date", type: "date", required: true },
        {
          name: "expense",
          type: "relation",
          required: false,
          collectionId: expenses.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    });
    app.save(settlements);

    // Remove new fields from groups
    groups.fields.removeByName("members");
    app.save(groups);

    // Remove new fields from expenses
    expenses.fields.removeByName("settled");
    expenses.fields.removeByName("settled_at");
    app.save(expenses);
  }
);
