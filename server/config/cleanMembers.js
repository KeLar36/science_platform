const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const cleanMembersField = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Успішно підключено до MongoDB...");

    const result = await mongoose.connection.db
      .collection("organizations")
      .updateMany({}, { $unset: { members: "" } });

    console.log(`Міграція успішна!`);
    console.log(`Оновлено організацій: ${result.modifiedCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Помилка під час виконання міграції:", error);
    process.exit(1);
  }
};

const users = await User.find({ organizationId: { $exists: true, $ne: null } });

for (const user of users) {
  if (typeof user.organizationId === "string") {
    user.organizationId = new mongoose.Types.ObjectId(user.organizationId);
    await user.save();
  }
}

cleanMembersField();
