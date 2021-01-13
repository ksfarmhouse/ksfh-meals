class CreateMeals < ActiveRecord::Migration[6.1]
  def change
    create_table :meals do |t|
      t.integer :user_id, foreign_key: { to_table: :users, column: :user_id }, null: false
      t.date :date, null: false
      t.string :lunch, null: false, limit: 2
      t.string :dinner, null: false, limit: 2
      t.integer :lunch_qty, null: false
      t.integer :dinner_qty, null: false
      t.timestamps
    end
  end
end
