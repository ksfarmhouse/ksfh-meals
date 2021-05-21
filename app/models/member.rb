class Member < ApplicationRecord
  has_many :meals
  has_one :weekly_meal
  validates :member_id, :first, :last, :status, presence: true
  validates_uniqueness_of :member_id

  attr_accessor :update_weekly_meals

  MEMBER_STATUSES =
  [["In House", "I"],
   ["Out of House", "O"],
   ["Alumnus", "A"]]

  def in_house?
    status == "I"
  end

  def out_of_house?
    status == "O"
  end

  def alumnus?
    status == "A"
  end

  def full_name
    "#{first} #{last}"
  end
end