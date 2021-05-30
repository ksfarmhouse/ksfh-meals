class Meal < ApplicationRecord
  has_one :member
  validates :member_id, :date, :lunch, :dinner, :lunch_qty, :dinner_qty, presence: true
  validates_uniqueness_of :member_id, scope: :date
  
  MEAL_TYPES =
    [["Lunch In", "LI"],
    ["Lunch Out", "LO"],
    ["Lunch Early", "LE"],
    ["Lunch Late", "LL"],
    ["Lunch Guests", "LG"],
    ["Dinner In", "DI"],
    ["Dinner Out", "DO"],
    ["Dinner Early", "DE"],
    ["Dinner Late", "DL"],
    ["Dinner Guests", "DG"]]

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