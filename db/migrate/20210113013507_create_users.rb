class CreateUsers < ActiveRecord::Migration[6.1]
  def change
    create_table :users do |t|
      t.integer :user_id, null: false
      t.string :first, null: false
      t.string :last, null: false
      t.boolean :out_of_house, null: false, default: true
      t.timestamps
    end
  end
end
