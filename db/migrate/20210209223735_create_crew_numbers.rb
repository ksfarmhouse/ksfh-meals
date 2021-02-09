class CreateCrewNumbers < ActiveRecord::Migration[6.1]
  def change
    create_table :crew_numbers do |t|
      t.integer :lunch_crew_num
      t.integer :dinner_crew_num
      t.integer :table_capacity
      t.timestamps
    end
  end
end
