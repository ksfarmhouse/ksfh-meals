class Menu < ApplicationRecord
  self.table_name = "menu"
  validates_uniqueness_of :date

end