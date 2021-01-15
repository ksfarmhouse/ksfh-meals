class Meal < ApplicationRecord
  has_one :user
  validates :member_id, :date, :lunch, :dinner, :lunch_qty, :dinner_qty, presence: true
  validates_uniqueness_of :member_id, scope: :date
  

  LUNCH_TYPES =
    [["In", "LI"],
    ["Out", "LO"],
    ["Early", "LE"],
    ["Late", "LL"]]

  DINNER_TYPES =
    [["In", "DI"],
    ["Out", "DO"],
    ["Early", "DE"],
    ["Late", "DL"]]
end