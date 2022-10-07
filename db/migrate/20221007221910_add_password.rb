class AddPassword < ActiveRecord::Migration[6.1]
  def change
    add_column :crew_numbers, :password, :string
  end
end
