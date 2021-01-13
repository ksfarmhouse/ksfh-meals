class CreateMenu < ActiveRecord::Migration[6.1]
  def change
    create_table :menu do |t|
      t.date :date, null: false
      t.string :lunch, limit: 70
      t.string :dinner, limit: 70
      t.timestamps
    end
  end
end
