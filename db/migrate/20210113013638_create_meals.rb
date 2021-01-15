 class CreateMeals < ActiveRecord::Migration[6.1]
  def change
    create_table :meals do |t|
      t.integer :member_id, foreign_key: { to_table: :member, column: :member_id }, null: false
      t.date :date, null: false, default: -> { 'CURRENT_DATE' }
      t.string :lunch, null: false, limit: 2, default: "LI"
      t.string :dinner, null: false, limit: 2, default: "DI"
      t.integer :lunch_qty, null: false, default: 1
      t.integer :dinner_qty, null: false, default: 1
      t.timestamps
    end

    add_index :meals, [:member_id, :date], unique: true
  end
end
