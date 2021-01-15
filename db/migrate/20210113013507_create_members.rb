class CreateMembers < ActiveRecord::Migration[6.1]
  def change
    create_table :members do |t|
      t.integer :member_id, null: false
      t.string :first, null: false
      t.string :last, null: false
      t.string :status, null: false, limit: 1, default: "I"
      t.timestamps
    end

    add_index :members, :member_id, unique: true
  end
end
