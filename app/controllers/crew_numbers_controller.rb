class CrewNumbersController < ApplicationController
  def edit
    redirect_to techchair_login_path unless logged_in?
    params[:admin] = true
    @crew_numbers = CrewNumber.all.first!
  end

  def update
    redirect_to techchair_login_path unless logged_in?
    crew_numbers = CrewNumber.all.first!

    respond_to do |format|
      if crew_numbers.update(crew_number_attributes)
        format.html {redirect_to crew_numbers_edit_path, notice: "Successfully Updated Crew Numbers!"}
      else
        format.html {redirect_to crew_numbers_edit_path, alert: "Unable to Update Crew Numbers!"}
      end
    end
  end

  private
  def crew_number_attributes
    params.require(:crew_number).permit(:lunch_crew_num, :dinner_crew_num, :table_capacity)
  end
end