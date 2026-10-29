#include <cctype>
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <map>
#include <random>
#include <sstream>
#include <string>
#include <vector>

namespace krai {
constexpr int kWorldSize = 36;
constexpr int kViewRadius = 8;
constexpr double kPi = 3.14159265358979323846;

enum class Terrain { Grass, Shore, Stone, Water };
enum class ResourceKind { Pine, Stone, Berries, Scrap };
enum class BuildKind { Campfire, Foundation, Wall };
enum class Tool { Rock, Axe, Pickaxe, Spear, Campfire, Foundation, Wall, Berries };

enum class Material { Wood, Stone, Fiber, Berries, Scrap };

struct Tile {
    Terrain terrain{Terrain::Grass};
    int elevation{0};
};

struct ResourceNode {
    int id{};
    ResourceKind kind{};
    double x{};
    double y{};
    int health{};
    int maxHealth{};
    bool alive{true};
};

struct Structure {
    int id{};
    BuildKind kind{};
    int x{};
    int y{};
};

struct Player {
    double x{15.5};
    double y{22.5};
    double health{92};
    double hunger{82};
    double water{74};
    double stamina{100};
};

struct Inventory {
    std::map<Material, int> materials{
        {Material::Wood, 0}, {Material::Stone, 0}, {Material::Fiber, 0},
        {Material::Berries, 2}, {Material::Scrap, 0}};
    std::map<Tool, int> tools{
        {Tool::Rock, 1}, {Tool::Axe, 0}, {Tool::Pickaxe, 0}, {Tool::Spear, 0},
        {Tool::Campfire, 0}, {Tool::Foundation, 0}, {Tool::Wall, 0}};
    int bottleCharges{3};
    int bandages{1};
};

class Game {
public:
    explicit Game(std::uint32_t seed = 20261029) : rng_(seed) {
        generateWorld();
    }

    void run() {
        std::string command;
        while (true) {
            render();
            std::cout << "\n  > ";
            if (!std::getline(std::cin, command)) break;
            if (!handle(command)) break;
            advance(1.0);
        }
        std::cout << "\nБереги себя. Полынь не прощает спешки.\n";
    }

private:
    std::array<std::array<Tile, kWorldSize>, kWorldSize> tiles_{};
    std::vector<ResourceNode> nodes_;
    std::vector<Structure> structures_;
    Player player_{};
    Inventory inventory_{};
    std::mt19937 rng_;
    int nextId_{1};
    int selectedSlot_{0};
    int worldMinutes_{8 * 60 + 20};
    int day_{1};
    int facingX_{1};
    int facingY_{0};
    int playTurns_{0};
    bool torchLit_{true};
    std::string lastMessage_{"Ты очнулся у холодного берега. Собери дерево и камень до наступления ночи."};

    static double distance(double ax, double ay, double bx, double by) {
        return std::hypot(ax - bx, ay - by);
    }

    static std::string materialName(Material m) {
        switch (m) {
            case Material::Wood: return "древесина";
            case Material::Stone: return "камень";
            case Material::Fiber: return "волокно";
            case Material::Berries: return "ягоды";
            case Material::Scrap: return "детали";
        }
        return "ресурс";
    }

    static std::string toolName(Tool t) {
        switch (t) {
            case Tool::Rock: return "Камень";
            case Tool::Axe: return "Каменный топор";
            case Tool::Pickaxe: return "Каменная кирка";
            case Tool::Spear: return "Копьё";
            case Tool::Campfire: return "Костёр";
            case Tool::Foundation: return "Фундамент";
            case Tool::Wall: return "Стена";
            case Tool::Berries: return "Ягоды";
        }
        return "предмет";
    }

    static char terrainGlyph(Terrain t) {
        switch (t) {
            case Terrain::Grass: return '.';
            case Terrain::Shore: return ':';
            case Terrain::Stone: return '^';
            case Terrain::Water: return '~';
        }
        return '?';
    }

    static const char* terrainColor(Terrain t) {
        switch (t) {
            case Terrain::Grass: return "\033[38;5;108m";
            case Terrain::Shore: return "\033[38;5;180m";
            case Terrain::Stone: return "\033[38;5;250m";
            case Terrain::Water: return "\033[38;5;67m";
        }
        return "\033[0m";
    }

    void generateWorld() {
        std::uniform_real_distribution<double> roll(0.0, 1.0);
        const double cx = 18.0;
        const double cy = 17.0;
        for (int y = 0; y < kWorldSize; ++y) {
            for (int x = 0; x < kWorldSize; ++x) {
                const double wave = std::sin(x * 0.31) * 1.1 + std::cos(y * 0.23) * 0.9;
                const double d = distance(x, y, cx, cy);
                Tile& tile = tiles_[y][x];
                if (d > 14.0 + wave) tile.terrain = Terrain::Water;
                else if (d > 12.3 + wave) tile.terrain = Terrain::Shore;
                else if (roll(rng_) > 0.88) {
                    tile.terrain = Terrain::Stone;
                    tile.elevation = 1 + (roll(rng_) > 0.65 ? 1 : 0);
                } else {
                    tile.terrain = Terrain::Grass;
                    tile.elevation = roll(rng_) > 0.89 ? 1 : 0;
                }
            }
        }
        // Clear spawn and guarantee a few early-game resources nearby.
        for (int y = 19; y <= 26; ++y) {
            for (int x = 12; x <= 20; ++x) {
                if (distance(x + .5, y + .5, player_.x, player_.y) < 3.6) {
                    tiles_[y][x] = Tile{Terrain::Grass, 0};
                }
            }
        }
        for (int y = 2; y < kWorldSize - 2; ++y) {
            for (int x = 2; x < kWorldSize - 2; ++x) {
                const Tile& tile = tiles_[y][x];
                if (tile.terrain == Terrain::Water || tile.terrain == Terrain::Shore || distance(x + .5, y + .5, player_.x, player_.y) < 3.4) continue;
                const double r = roll(rng_);
                if (tile.terrain == Terrain::Stone && r < .48) addNode(ResourceKind::Stone, x + .5, y + .5);
                else if (tile.terrain == Terrain::Grass && r < .075) addNode(ResourceKind::Pine, x + .5, y + .5);
                else if (tile.terrain == Terrain::Grass && r > .89 && r < .97) addNode(ResourceKind::Berries, x + .5, y + .5);
                else if (tile.terrain == Terrain::Grass && r > .988) addNode(ResourceKind::Scrap, x + .5, y + .5);
            }
        }
        addNode(ResourceKind::Pine, 12.5, 22.5);
        addNode(ResourceKind::Pine, 19.5, 21.5);
        addNode(ResourceKind::Stone, 18.5, 24.5);
        addNode(ResourceKind::Berries, 14.5, 19.5);
        addNode(ResourceKind::Stone, 12.5, 26.5);
        addNode(ResourceKind::Scrap, 10.5, 22.5);
    }

    void addNode(ResourceKind kind, double x, double y) {
        for (const auto& node : nodes_) {
            if (node.alive && distance(node.x, node.y, x, y) < .75) return;
        }
        const int hp = kind == ResourceKind::Pine || kind == ResourceKind::Stone ? 3 : kind == ResourceKind::Berries ? 2 : 1;
        nodes_.push_back(ResourceNode{nextId_++, kind, x, y, hp, hp, true});
    }

    Tile tileAt(double x, double y) const {
        const int ix = static_cast<int>(std::floor(x));
        const int iy = static_cast<int>(std::floor(y));
        if (ix < 0 || iy < 0 || ix >= kWorldSize || iy >= kWorldSize) return Tile{Terrain::Water, 0};
        return tiles_[iy][ix];
    }

    ResourceNode* nearestNode(double maxDistance = 3.0) {
        ResourceNode* nearest = nullptr;
        double best = maxDistance;
        for (auto& node : nodes_) {
            if (!node.alive) continue;
            const double d = distance(node.x, node.y, player_.x, player_.y);
            if (d < best) { best = d; nearest = &node; }
        }
        return nearest;
    }

    void advance(double seconds) {
        ++playTurns_;
        worldMinutes_ += 4;
        if (worldMinutes_ >= 24 * 60) { worldMinutes_ -= 24 * 60; ++day_; }
        player_.hunger = std::max(0.0, player_.hunger - .035 * seconds);
        player_.water = std::max(0.0, player_.water - .055 * seconds);
        if (player_.hunger <= 0) player_.health = std::max(0.0, player_.health - .6 * seconds);
        if (player_.water <= 0) player_.health = std::max(0.0, player_.health - 1.0 * seconds);
        if (player_.health <= 0) respawn();
    }

    bool canMoveTo(double x, double y) const {
        if (tileAt(x, y).terrain == Terrain::Water) return false;
        for (const auto& node : nodes_) {
            if (node.alive && distance(x, y, node.x, node.y) < .46) return false;
        }
        for (const auto& structure : structures_) {
            if (structure.kind == BuildKind::Wall && distance(x, y, structure.x + .5, structure.y + .5) < .48) return false;
        }
        return true;
    }

    void move(int dx, int dy, bool sprint = false) {
        if (dx == 0 && dy == 0) return;
        facingX_ = dx;
        facingY_ = dy;
        bool moved = false;
        const int steps = sprint && player_.stamina > 10 ? 2 : 1;
        for (int step = 0; step < steps; ++step) {
            const double nx = player_.x + dx;
            const double ny = player_.y + dy;
            if (!canMoveTo(nx, player_.y) || !canMoveTo(player_.x, ny)) break;
            player_.x = nx;
            player_.y = ny;
            moved = true;
        }
        if (moved) {
            player_.stamina = std::max(0.0, player_.stamina - (sprint ? 13.0 : 2.0));
            lastMessage_ = sprint ? "Короткий рывок! Выносливость −13." : "Шаг за шагом. Смотри под ноги.";
        } else {
            lastMessage_ = "Впереди вода или преграда.";
        }
    }

    void interact() {
        ResourceNode* node = nearestNode();
        if (!node) { lastMessage_ = "Рядом нет ресурсов. Исследуй берег."; return; }
        if (node->kind == ResourceKind::Pine) {
            const int amount = 2 + (selectedSlot_ == 1 ? 2 : 0);
            inventory_.materials[Material::Wood] += amount;
            if (node->id % 2 == 0) ++inventory_.materials[Material::Fiber];
            --node->health;
            lastMessage_ = "Древесина +" + std::to_string(amount) + (node->id % 2 == 0 ? " · волокно +1" : "");
        } else if (node->kind == ResourceKind::Stone) {
            const int amount = 1 + (selectedSlot_ == 2 ? 2 : 0);
            inventory_.materials[Material::Stone] += amount;
            --node->health;
            lastMessage_ = "Камень +" + std::to_string(amount);
        } else if (node->kind == ResourceKind::Berries) {
            inventory_.materials[Material::Berries] += 2;
            if (node->health > 1) ++inventory_.materials[Material::Fiber];
            --node->health;
            lastMessage_ = "Ягоды +2 · лесной куст собран";
        } else {
            inventory_.materials[Material::Scrap] += 2;
            node->health = 0;
            lastMessage_ = "Старый ящик разобран · детали +2";
        }
        if (node->health <= 0) node->alive = false;
    }

    bool craft(int choice) {
        std::map<Material, int> cost;
        Tool output{};
        std::string name;
        int outputCount = 1;
        bool isBandage = false;
        switch (choice) {
            case 1: cost = {{Material::Wood, 3}, {Material::Stone, 2}, {Material::Fiber, 1}}; output = Tool::Axe; name = "каменный топор"; break;
            case 2: cost = {{Material::Wood, 2}, {Material::Stone, 3}, {Material::Fiber, 1}}; output = Tool::Pickaxe; name = "каменная кирка"; break;
            case 3: cost = {{Material::Wood, 3}, {Material::Stone, 2}, {Material::Fiber, 2}}; output = Tool::Spear; name = "копьё"; break;
            case 4: cost = {{Material::Wood, 4}, {Material::Stone, 2}}; output = Tool::Campfire; name = "костёр"; break;
            case 5: cost = {{Material::Wood, 8}}; output = Tool::Foundation; name = "фундамент"; break;
            case 6: cost = {{Material::Wood, 6}}; output = Tool::Wall; name = "стена"; break;
            case 7: cost = {{Material::Fiber, 3}, {Material::Berries, 1}}; name = "повязка"; isBandage = true; break;
            default: lastMessage_ = "Нет такого рецепта."; return false;
        }
        for (const auto& [material, amount] : cost) {
            if (inventory_.materials[material] < amount) {
                lastMessage_ = "Не хватает: " + materialName(material) + " ×" + std::to_string(amount - inventory_.materials[material]);
                return false;
            }
        }
        for (const auto& [material, amount] : cost) inventory_.materials[material] -= amount;
        if (isBandage) inventory_.bandages += outputCount;
        else inventory_.tools[output] += outputCount;
        lastMessage_ = "Изготовлено: " + name;
        return true;
    }

    void build(int choice) {
        Tool tool{};
        BuildKind kind{};
        if (choice == 1) { tool = Tool::Campfire; kind = BuildKind::Campfire; }
        else if (choice == 2) { tool = Tool::Foundation; kind = BuildKind::Foundation; }
        else if (choice == 3) { tool = Tool::Wall; kind = BuildKind::Wall; }
        else { lastMessage_ = "Нет такого плана постройки."; return; }
        if (inventory_.tools[tool] <= 0) {
            lastMessage_ = "Сначала изготовь предмет в меню крафта.";
            return;
        }
        const int x = static_cast<int>(std::floor(player_.x + facingX_));
        const int y = static_cast<int>(std::floor(player_.y + facingY_));
        const Terrain terrain = tileAt(x + .5, y + .5).terrain;
        if (terrain == Terrain::Water || terrain == Terrain::Shore) { lastMessage_ = "На воде или песке строить нельзя."; return; }
        for (const auto& structure : structures_) {
            if (structure.x == x && structure.y == y) { lastMessage_ = "Здесь уже есть постройка."; return; }
        }
        structures_.push_back(Structure{nextId_++, kind, x, y});
        --inventory_.tools[tool];
        lastMessage_ = kind == BuildKind::Campfire ? "Костёр поставлен. Он освещает поляну и согревает рядом." : "Постройка размещена.";
    }

    void eat() {
        if (inventory_.materials[Material::Berries] <= 0) { lastMessage_ = "Ягод не осталось. Найди куст."; return; }
        if (player_.hunger > 96) { lastMessage_ = "Ты не голоден — оставь ягоды на потом."; return; }
        --inventory_.materials[Material::Berries];
        player_.hunger = std::min(100.0, player_.hunger + 27.0);
        player_.water = std::min(100.0, player_.water + 7.0);
        lastMessage_ = "Съедены лесные ягоды · сытость +27.";
    }

    void drink() {
        if (inventory_.bottleCharges <= 0) { lastMessage_ = "Фляга пуста. Найди пресный ручей."; return; }
        if (player_.water > 92) { lastMessage_ = "Жажда пока не беспокоит."; return; }
        --inventory_.bottleCharges;
        player_.water = std::min(100.0, player_.water + 34.0);
        lastMessage_ = "Глоток из фляги · вода +34.";
    }

    void heal() {
        if (inventory_.bandages <= 0) { lastMessage_ = "Повязок нет. Изготовь её из волокна и ягод."; return; }
        if (player_.health > 88) { lastMessage_ = "Здоровье почти полное."; return; }
        --inventory_.bandages;
        player_.health = std::min(100.0, player_.health + 38.0);
        lastMessage_ = "Повязка наложена · здоровье +38.";
    }

    void respawn() {
        player_.health = 55;
        player_.hunger = std::max(player_.hunger, 25.0);
        player_.water = std::max(player_.water, 25.0);
        player_.x = 15.5;
        player_.y = 22.5;
        inventory_.materials[Material::Wood] = static_cast<int>(inventory_.materials[Material::Wood] * .7);
        inventory_.materials[Material::Stone] = static_cast<int>(inventory_.materials[Material::Stone] * .7);
        lastMessage_ = "Сознание вернулось у берега. Часть ресурсов потеряна.";
    }

    bool handle(const std::string& raw) {
        if (raw.empty()) return true;
        std::string command = raw;
        std::transform(command.begin(), command.end(), command.begin(), [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
        if (command == "q" || command == "quit" || command == "выход") return false;
        if (command == "w" || command == "up") move(0, -1);
        else if (command == "s" || command == "down") move(0, 1);
        else if (command == "a" || command == "left") move(-1, 0);
        else if (command == "d" || command == "right") move(1, 0);
        else if (command == "run") move(facingX_, facingY_, true);
        else if (command == "e") interact();
        else if (command == "f") eat();
        else if (command == "g") drink();
        else if (command == "h") heal();
        else if (command == "t") { torchLit_ = !torchLit_; lastMessage_ = torchLit_ ? "Факел зажжён." : "Факел потушен."; }
        else if (command == "i") showInventory();
        else if (command == "c") craftMenu();
        else if (command == "b") buildMenu();
        else if (command == "help" || command == "?") lastMessage_ = "WASD — идти, E — собрать, C — крафт, B — стройка, F — еда, G — вода, H — лечение, 1–8 — слот, Q — выход.";
        else if (command.size() == 1 && command[0] >= '1' && command[0] <= '8') selectSlot(command[0] - '1');
        else lastMessage_ = "Команда не распознана. Нажми ? для списка управления.";
        return true;
    }

    void selectSlot(int slot) {
        static const std::array<Tool, 8> slots{Tool::Rock, Tool::Axe, Tool::Pickaxe, Tool::Spear, Tool::Campfire, Tool::Foundation, Tool::Wall, Tool::Berries};
        const Tool item = slots[slot];
        const int count = item == Tool::Berries ? inventory_.materials[Material::Berries] : inventory_.tools[item];
        if (item != Tool::Rock && count <= 0) { lastMessage_ = "Предмет отсутствует. Создай его в меню крафта."; return; }
        selectedSlot_ = slot;
        lastMessage_ = "Выбрано: " + toolName(item);
    }

    void craftMenu() {
        std::cout << "\n  РЕЦЕПТЫ  [1] Топор  [2] Кирка  [3] Копьё  [4] Костёр\n"
                  << "            [5] Фундамент  [6] Стена  [7] Повязка  [0] Назад\n  Создать: ";
        std::string input;
        std::getline(std::cin, input);
        if (input == "0" || input.empty()) { lastMessage_ = "Вернулся к миру."; return; }
        if (!input.empty() && input[0] >= '1' && input[0] <= '7') craft(input[0] - '0');
        else lastMessage_ = "Нет такого рецепта.";
    }

    void buildMenu() {
        std::cout << "\n  ПОСТРОЙКА  [1] Костёр  [2] Фундамент  [3] Стена  [0] Назад\n  План: ";
        std::string input;
        std::getline(std::cin, input);
        if (input == "0" || input.empty()) { lastMessage_ = "Вернулся к миру."; return; }
        if (!input.empty() && input[0] >= '1' && input[0] <= '3') build(input[0] - '0');
        else lastMessage_ = "Нет такого плана.";
    }

    void showInventory() {
        std::ostringstream line;
        line << "Рюкзак · дерево " << inventory_.materials[Material::Wood]
             << " · камень " << inventory_.materials[Material::Stone]
             << " · волокно " << inventory_.materials[Material::Fiber]
             << " · ягоды " << inventory_.materials[Material::Berries]
             << " · детали " << inventory_.materials[Material::Scrap]
             << " · вода " << inventory_.bottleCharges;
        lastMessage_ = line.str();
    }

    int hour() const { return (worldMinutes_ / 60) % 24; }
    int minute() const { return worldMinutes_ % 60; }

    static std::string bar(double value, int width = 15) {
        const int filled = std::clamp(static_cast<int>(std::round(value / 100.0 * width)), 0, width);
        return "\033[38;5;180m" + std::string(filled, '#') + "\033[38;5;238m" + std::string(width - filled, '-') + "\033[0m";
    }

    void render() const {
        std::cout << "\033[2J\033[H";
        std::cout << "\033[38;5;180m  K R A I  /  П О Л Ы Н Ь\033[0m  \033[38;5;245mСЕВЕРНЫЙ БЕРЕГ · СЕРВЕР #01\033[0m\n";
        std::cout << "  День " << std::setw(2) << std::setfill('0') << day_ << "  "
                  << std::setw(2) << hour() << ':' << std::setw(2) << minute()
                  << "   " << (hour() < 6 || hour() > 20 ? "МОРОЗНО  -3°C" : "ВЕТЕР С ЗАЛИВА  +4°C")
                  << "   \033[38;5;108m● МИР СОХРАНЁН\033[0m\n\n";
        std::cout << "  ЗДОРОВЬЕ " << bar(player_.health) << ' ' << std::setw(3) << static_cast<int>(player_.health)
                  << "   СЫТОСТЬ " << bar(player_.hunger, 10) << ' ' << std::setw(3) << static_cast<int>(player_.hunger)
                  << "   ВОДА " << bar(player_.water, 10) << ' ' << std::setw(3) << static_cast<int>(player_.water) << "\n";
        std::cout << "  ВЫНОСЛИВОСТЬ " << bar(player_.stamina, 10) << ' ' << std::setw(3) << static_cast<int>(player_.stamina) << "\n\n";
        renderMap();
        const ResourceNode* target = nullptr;
        double best = 3.0;
        for (const auto& node : nodes_) {
            if (!node.alive) continue;
            const double d = distance(node.x, node.y, player_.x, player_.y);
            if (d < best) { best = d; target = &node; }
        }
        std::cout << "\n  РЕСУРСЫ  ДЕРЕВО " << inventory_.materials.at(Material::Wood)
                  << "  КАМЕНЬ " << inventory_.materials.at(Material::Stone)
                  << "  ВОЛОКНО " << inventory_.materials.at(Material::Fiber)
                  << "  ЯГОДЫ " << inventory_.materials.at(Material::Berries) << "\n";
        if (target) {
            std::string action = target->kind == ResourceKind::Pine ? "срубить ель" : target->kind == ResourceKind::Stone ? "добыть камень" : target->kind == ResourceKind::Berries ? "собрать ягоды" : "разобрать ящик";
            std::cout << "  [E] " << action << "   ·   " << std::fixed << std::setprecision(1) << best << " м\n";
        } else {
            std::cout << "  Рядом нет ресурсов — исследуй берег и лес.\n";
        }
        std::cout << "\n  " << (selectedSlot_ + 1) << ": " << toolName(selectedTool())
                  << "  ·  Фляга " << inventory_.bottleCharges << "  ·  Повязки " << inventory_.bandages << "\n";
        std::cout << "  " << (torchLit_ ? "Факел горит" : "Факел потушен") << "  ·  Координаты "
                  << std::setw(2) << static_cast<int>(player_.x) << ':' << std::setw(2) << static_cast<int>(player_.y) << "\n";
        std::cout << "\n  \033[38;5;180m" << lastMessage_ << "\033[0m\n\n";
        std::cout << "  WASD идти  ·  RUN бег  ·  E собрать  ·  C крафт  ·  B стройка\n"
                  << "  F еда  ·  G вода  ·  H лечение  ·  T факел  ·  I рюкзак  ·  Q выход\n";
    }

    Tool selectedTool() const {
        static const std::array<Tool, 8> slots{Tool::Rock, Tool::Axe, Tool::Pickaxe, Tool::Spear, Tool::Campfire, Tool::Foundation, Tool::Wall, Tool::Berries};
        return slots[selectedSlot_];
    }

    void renderMap() const {
        const int px = static_cast<int>(std::floor(player_.x));
        const int py = static_cast<int>(std::floor(player_.y));
        std::cout << "  . трава  : берег  ^ камень  ~ вода  T ель  * ягоды  ? тайник  @ ты\n\n";
        for (int y = py - kViewRadius; y <= py + kViewRadius; ++y) {
            std::cout << "  ";
            for (int x = px - kViewRadius; x <= px + kViewRadius; ++x) {
                if (x == px && y == py) { std::cout << "\033[1;38;5;223m@ \033[0m"; continue; }
                bool drawn = false;
                for (const auto& structure : structures_) {
                    if (structure.x == x && structure.y == y) {
                        const char symbol = structure.kind == BuildKind::Campfire ? 'F' : structure.kind == BuildKind::Foundation ? '=' : '#';
                        std::cout << "\033[38;5;180m" << symbol << " \033[0m";
                        drawn = true;
                        break;
                    }
                }
                if (drawn) continue;
                for (const auto& node : nodes_) {
                    if (!node.alive || static_cast<int>(std::floor(node.x)) != x || static_cast<int>(std::floor(node.y)) != y) continue;
                    const char symbol = node.kind == ResourceKind::Pine ? 'T' : node.kind == ResourceKind::Stone ? 'O' : node.kind == ResourceKind::Berries ? '*' : '?';
                    const char* color = node.kind == ResourceKind::Pine ? "\033[38;5;71m" : node.kind == ResourceKind::Stone ? "\033[38;5;252m" : node.kind == ResourceKind::Berries ? "\033[38;5;174m" : "\033[38;5;180m";
                    std::cout << color << symbol << " \033[0m";
                    drawn = true;
                    break;
                }
                if (drawn) continue;
                const Terrain terrain = tileAt(x + .5, y + .5).terrain;
                std::cout << terrainColor(terrain) << terrainGlyph(terrain) << " \033[0m";
            }
            std::cout << '\n';
        }
    }
};
} // namespace krai

int main() {
    std::cout << "\033[?25l";
    krai::Game game;
    game.run();
    std::cout << "\033[?25h";
    return 0;
}
