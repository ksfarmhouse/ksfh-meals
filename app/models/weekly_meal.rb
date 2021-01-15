class WeeklyMeal < ApplicationRecord
  has_one :member
  validates :member_id,
    :mon_lunch, :mon_dinner,
    :tue_lunch, :tue_dinner,
    :wed_lunch, :wed_dinner,
    :thu_lunch, :thu_dinner,
    :fri_lunch, :fri_dinner,
    presence: true

  def self.create_in_meals
    WeeklyMeal.new(
      mon_lunch: "LI", mon_dinner: "DI",
      tue_lunch: "LI", tue_dinner: "DI",
      wed_lunch: "LI", wed_dinner: "DI",
      thu_lunch: "LI", thu_dinner: "DI",
      fri_lunch: "LI", fri_dinner: "DI"
    )
  end

  def self.create_out_meals
    WeeklyMeal.new(
      mon_lunch: "LO", mon_dinner: "DO",
      tue_lunch: "LO", tue_dinner: "DO",
      wed_lunch: "LO", wed_dinner: "DO",
      thu_lunch: "LO", thu_dinner: "DO",
      fri_lunch: "LO", fri_dinner: "DO"
    )
  end
end