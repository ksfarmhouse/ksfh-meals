module ApplicationHelper
  def full_status_name(status)
    case status
    when "I"
      "In House"
    when "O"
      "Out of House"
    when "A"
      "Alumni"
    end
  end
end  
