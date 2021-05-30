class ChangeDefaultMemberStatus < ActiveRecord::Migration[6.1]
  def change
    change_column_default :members, :status, "N"
  end
end
