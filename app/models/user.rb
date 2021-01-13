class User < ApplicationRecord
  has_many :meals
  has_one :weekly_meal
  validates :user_id, :first, :last_name, :out_of_house, presence: true

  def in_house_member?
    !out_of_house?
  end

  def full_name
    "#{first} #{last}"
  end
end