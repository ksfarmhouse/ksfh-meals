class Meal < ApplicationRecord
  has_one :user
  validates :user_id, :date, :lunch, :dinner, :lunch_qty, :dinner_qty, presence: true
end