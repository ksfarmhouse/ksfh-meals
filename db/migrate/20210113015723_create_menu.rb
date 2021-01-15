class CreateMenu < ActiveRecord::Migration[6.1]
  def change
    create_table :menu do |t|
      t.date :date, null: false, default: DateTime.current().to_date
      t.string :lunch, limit: 70
      t.string :dinner, limit: 70
      t.timestamps
    end

    add_index :menu, :date, unique: true
  end
end
