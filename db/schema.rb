# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2022_10_07_221910) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "crew_numbers", force: :cascade do |t|
    t.integer "lunch_crew_num"
    t.integer "dinner_crew_num"
    t.integer "table_capacity"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "password"
  end

  create_table "meals", force: :cascade do |t|
    t.integer "member_id", null: false
    t.date "date", default: -> { "CURRENT_DATE" }, null: false
    t.string "lunch", limit: 2, default: "LI", null: false
    t.string "dinner", limit: 2, default: "DI", null: false
    t.integer "lunch_qty", default: 1, null: false
    t.integer "dinner_qty", default: 1, null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["member_id", "date"], name: "index_meals_on_member_id_and_date", unique: true
  end

  create_table "members", force: :cascade do |t|
    t.integer "member_id", null: false
    t.string "first", null: false
    t.string "last", null: false
    t.string "status", limit: 1, default: "N", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["member_id"], name: "index_members_on_member_id", unique: true
  end

  create_table "menu", force: :cascade do |t|
    t.date "date", default: "2021-01-15", null: false
    t.string "lunch", limit: 70
    t.string "dinner", limit: 70
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["date"], name: "index_menu_on_date", unique: true
  end

  create_table "weekly_meals", force: :cascade do |t|
    t.integer "member_id", null: false
    t.string "mon_lunch", limit: 2, default: "LI", null: false
    t.string "mon_dinner", limit: 2, default: "DI", null: false
    t.string "tue_lunch", limit: 2, default: "LI", null: false
    t.string "tue_dinner", limit: 2, default: "DI", null: false
    t.string "wed_lunch", limit: 2, default: "LI", null: false
    t.string "wed_dinner", limit: 2, default: "DI", null: false
    t.string "thu_lunch", limit: 2, default: "LI", null: false
    t.string "thu_dinner", limit: 2, default: "DI", null: false
    t.string "fri_lunch", limit: 2, default: "LI", null: false
    t.string "fri_dinner", limit: 2, default: "DI", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["member_id"], name: "index_weekly_meals_on_member_id", unique: true
  end

end
