class MembersController < ApplicationController
  def index
    @members = Member.all.order(:last, :first)
    params[:admin] = true
  end

  def csv_export
    @new_members = Member.where(status: "N").order(:last, :first)

    respond_to do |format|
      format.csv {send_data @new_members.to_csv, filename: "New Member Export #{Date.today.strftime("%-m-%-d-%y")}.csv"}
    end
  end

  def new
    @member = Member.new
    params[:admin] = true
  end

  def create
    @member = Member.new(member_params)
    respond_to do |format|
      if Member.where(member_id: params[:member][:member_id]).blank?
        if @member.save!
          weekly_meals = @member.in_house? ? WeeklyMeal.create_in_meals : WeeklyMeal.create_out_meals
          weekly_meals.member_id = @member.member_id
          if weekly_meals.save!
            format.html {redirect_to new_members_path, notice: "Member Created!"}
          else
            format.html {redirect_to new_members_path, alert: "Member Created, Weekly Meals Not Created!"}
          end
        else
          format.html {redirect_to new_members_path, alert: "Unable to Create Member!"}
        end
      else
        format.html {redirect_to new_members_path, alert: "Member ID Already Taken!"}
      end
    end
  end

  def edit
    @member = Member.find(params[:id])
    params[:admin] = true
  end

  def update
    @member = Member.find(params[:id])
    respond_to do |format|
      if @member.update(member_params)
        if params[:member][:update_weekly_meals] == "1" && !@member.in_house?
          if WeeklyMeal.find_by(member_id: @member.member_id).update(WeeklyMeal.out_meals) && Meal.where(member_id: @member.member_id).update_all(lunch: "LO", dinner: "DO")
            format.html {redirect_to members_path, notice: "Member and Weekly Meals Updated!"}
          else
            format.html {redirect_to edit_members_path(id: @member.id), alert: "Member Updated, Weekly Meals Not Updated!"}
          end
        else
          format.html {redirect_to members_path, notice: "Member Updated!"}
        end
      else
        format.html {redirect_to edit_members_path(id: @member.id), alert: "Unable to Update Member!"}
      end
    end
  end

  def members_ajax
    @id_present = Member.where(member_id: params[:member_id]).present?

    respond_to do |format|
      format.js
    end
  end


  def mass_edit
    @members = Member.all.order(:last, :first).to_a
    params[:admin] = true
  end

  def mass_edit_update
    succeed = true

    params[:member].each do |member|
      m = Member.find_by(member_id: member[0])
      if !m.update(member[1].permit(:first, :last, :status))
        succeed = false
      end
    end

    respond_to do |format|
      if succeed
        format.html {redirect_to members_path, notice: "Members Updated!"}
      else
        format.html {redirect_to members_path, alert: "Unable to Update Members!"}
      end
    end
  end

  def activate_new_members
    respond_to do |format|
      if Member.where(status: "N").update_all(status: "I")
        format.html {redirect_to members_path, notice: "Members Updated!"}
      else
        format.html {redirect_to members_path, alert: "Unable to Update Members!"}
      end
    end
    
  end

  def delete
    @member = Member.find(params[:id])
    respond_to do |format|
      if @member.delete && WeeklyMeal.find_by(member_id: @member.member_id).delete && Meal.where(member_id: @member.member_id).destroy_all
        format.html {redirect_to members_path, notice: "Member Deleted!"}
      else
        format.html {redirect_to members_path, alert: "Unable to Delete Member!"}
      end
    end
  end

  private
  def member_params
    params.require(:member).permit(:member_id, :first, :last, :status, :update_weekly_meals)
  end
end