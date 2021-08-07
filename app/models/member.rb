class Member < ApplicationRecord
  has_many :meals
  has_one :weekly_meal
  validates :member_id, :first, :last, :status, presence: true
  validates_uniqueness_of :member_id

  attr_accessor :update_weekly_meals

  MEMBER_STATUSES =
  [["New Member", "N"],
   ["In House", "I"],
   ["Out of House", "O"],
   ["Alumnus", "A"]]

  def in_house?
    status == "I" || status == "N"
  end

  def full_name
    "#{first} #{last}"
  end

  def self.to_csv
    CSV.generate(headers: true) do |csv|
      csv << %w{Member\ ID First Last}

      all.each do |member|
        csv << [member.member_id, member.first, member.last]
      end
    end
  end
end