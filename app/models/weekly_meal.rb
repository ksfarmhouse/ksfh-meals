class WeeklyMeal < ApplicationRecord
  has_one :user
  validates :user_id,
    :mon_lunch, :mon_dinner,
    :tue_lunch, :tue_dinner,
    :wed_lunch, :wed_dinner,
    :thu_lunch, :thu_dinner,
    :fri_lunch, :fri_dinner,
    presence: true
end