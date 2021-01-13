class CreateWeeklyMeals < ActiveRecord::Migration[6.1]
  def change
    create_table :weekly_meals do |t|
      t.integer :user_id, foreign_key: { to_table: :users, column: :user_id }, null: false
      t.string :mon_lunch, null: false, limit: 2
      t.string :mon_dinner, null: false, limit: 2
      t.string :tue_lunch, null: false, limit: 2
      t.string :tue_dinner, null: false, limit: 2
      t.string :wed_lunch, null: false, limit: 2
      t.string :wed_dinner, null: false, limit: 2
      t.string :thu_lunch, null: false, limit: 2
      t.string :thu_dinner, null: false, limit: 2
      t.string :fri_lunch, null: false, limit: 2
      t.string :fri_dinner, null: false, limit: 2
      t.timestamps
    end
  end
end
