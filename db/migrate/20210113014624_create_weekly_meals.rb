class CreateWeeklyMeals < ActiveRecord::Migration[6.1]
  def change
    create_table :weekly_meals do |t|
      t.integer :member_id, foreign_key: { to_table: :users, column: :member_id }, null: false, unique: true
      t.string :mon_lunch, null: false, limit: 2, default: "LI"
      t.string :mon_dinner, null: false, limit: 2, default: "DI"
      t.string :tue_lunch, null: false, limit: 2, default: "LI"
      t.string :tue_dinner, null: false, limit: 2, default: "DI"
      t.string :wed_lunch, null: false, limit: 2, default: "LI"
      t.string :wed_dinner, null: false, limit: 2, default: "DI"
      t.string :thu_lunch, null: false, limit: 2, default: "LI"
      t.string :thu_dinner, null: false, limit: 2, default: "DI"
      t.string :fri_lunch, null: false, limit: 2, default: "LI"
      t.string :fri_dinner, null: false, limit: 2, default: "DI"
      t.timestamps
    end

    add_index :weekly_meals, :member_id, unique: true
  end
end
