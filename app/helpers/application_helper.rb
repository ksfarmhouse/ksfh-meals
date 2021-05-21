module ApplicationHelper
  def full_status_name(status)
    case status
    when "I"
      "In House"
    when "O"
      "Out of House"
    when "A"
      "Alumnus"
    end
  end
end  
